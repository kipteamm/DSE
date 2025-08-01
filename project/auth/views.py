from flask_login import login_user, logout_user
from flask import Blueprint, render_template, request, redirect, url_for, make_response

from project.auth.models import User
from project.extensions import oauth
from project.secrets import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET


auth_blueprint = Blueprint("auth", __name__)


oauth.register(
    name='google',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    access_token_url='https://oauth2.googleapis.com/token',
    access_token_params=None,
    authorize_url='https://accounts.google.com/o/oauth2/v2/auth',
    authorize_params=None,
    api_base_url='https://www.googleapis.com/oauth2/v2/',
    client_kwargs={'scope': 'email profile'}
)

oauth.register(
    name='facebook',
    client_id=FACEBOOK_CLIENT_ID,
    client_secret=FACEBOOK_CLIENT_SECRET,
    access_token_url='https://graph.facebook.com/oauth/access_token',
    authorize_url='https://www.facebook.com/dialog/oauth',
    api_base_url='https://graph.facebook.com/',
    client_kwargs={'scope': 'email'}
)


@auth_blueprint.get("/login")
def login():
    return render_template("auth/login.html")


@auth_blueprint.get("/login/<string:provider>")
def login_provider(provider: str):
    if not provider == "google" and not provider == "facebook":
        return redirect("/login")  

    redirect_uri = url_for("auth.auth_provider", provider=provider, _external=True)
    client = oauth.create_client(provider)
    
    assert client is not None
    
    return client.authorize_redirect(redirect_uri)


@auth_blueprint.route("/auth/<string:provider>")
def auth_provider(provider: str):
    if not provider == "google" and not provider == "facebook":
        return redirect("/login")  

    client = oauth.create_client(provider)
    assert client is not None

    client.authorize_access_token()

    if provider == "google":
        user_info = client.get("userinfo").json()
        print(user_info)
        email = user_info["email"]

    elif provider == "facebook":
        user_info = client.get("me?fields=name,email").json()
        print(user_info)
        email = user_info.get("email")

    if not email:
        return redirect("/login")
    
    user = User.get_or_create(email)
    login_user(user)

    response = make_response(redirect("/app"))
    response.set_cookie("i_t", user.token, max_age=2592000) # 30 * 60 * 60 * 24

    return response