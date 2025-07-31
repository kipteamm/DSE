from flask import Flask, redirect, url_for, session, request
from authlib.integrations.flask_client import OAuth
import os

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET", "supersecret")  # Replace for prod

oauth = OAuth(app)

# Google OAuth config
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    access_token_url='https://oauth2.googleapis.com/token',
    access_token_params=None,
    authorize_url='https://accounts.google.com/o/oauth2/v2/auth',
    authorize_params=None,
    api_base_url='https://www.googleapis.com/oauth2/v2/',
    client_kwargs={'scope': 'email profile'}
)

# Facebook OAuth config
oauth.register(
    name='facebook',
    client_id=os.getenv("FACEBOOK_CLIENT_ID"),
    client_secret=os.getenv("FACEBOOK_CLIENT_SECRET"),
    access_token_url='https://graph.facebook.com/oauth/access_token',
    authorize_url='https://www.facebook.com/dialog/oauth',
    api_base_url='https://graph.facebook.com/',
    client_kwargs={'scope': 'email'}
)

@app.route('/')
def homepage():
    return '<a href="/login/google">Login with Google</a> | <a href="/login/facebook">Login with Facebook</a>'

@app.route('/login/<provider>')
def login(provider):
    redirect_uri = url_for('auth', provider=provider, _external=True)
    return oauth.create_client(provider).authorize_redirect(redirect_uri)

@app.route('/auth/<provider>')
def auth(provider):
    client = oauth.create_client(provider)
    token = client.authorize_access_token()
    
    # Fetch user email
    if provider == 'google':
        user = client.get('userinfo').json()
        email = user['email']
    elif provider == 'facebook':
        user = client.get('me?fields=id,name,email').json()
        email = user.get('email')  # not always guaranteed if user hides email
    
    # You can now check if user exists in DB or create a session
    session['user'] = email
    return f"Logged in as {email}"

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect('/')
