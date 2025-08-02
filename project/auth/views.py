from werkzeug.wrappers import Response
from urllib.parse import quote_plus
from sqlalchemy.sql import exists

from flask_login import login_user, logout_user
from flask_mail import Message
from flask import Blueprint, render_template, request, redirect, url_for, make_response

from project.auth.models import User, EmailAuthentication
from project.extensions import oauth, db, mail
from project.secrets import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET, MAIL_ADDRESS

import secrets
import time
import json
import re


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


EMAIL_REGEX = re.compile(r"^[\w\.-]+@([\w\-]+\.)+[a-zA-Z]{2,}$")


def _handle_email(email: str | None, next_url: str) -> Response | str:
    if not email:
        return redirect("/login?next=" + next_url)

    if not EMAIL_REGEX.match(email):
        return redirect(f"/login?error={quote_plus('Invalid email address.')}&next={next_url}")
    
    authentication = EmailAuthentication.get_or_create(email)
    if authentication.attempts > 3:
        return redirect(f"/login?error={quote_plus('Max email attempts exceeded.')}&next={next_url}")
    
    now = time.time()
    if authentication.attempts > 0 and authentication.last_attempt + 60 > now:
        return redirect(f"/login?error={quote_plus('You need to wait in between attempts.')}&next={next_url}")
    
    authentication.code = str(secrets.randbelow(1000000)).zfill(6)
    authentication.attempts += 1
    authentication.last_attempt = now
    db.session.commit()

    message = Message(
        subject="Verifying it's you",
        sender=MAIL_ADDRESS,
        recipients=[email],
        html=render_template("email/verification.html", user=email.split("@")[0], code=authentication.code, app_domain=request.host_url, email=email)
    )

    mail.send(message)
    return render_template("auth/awaiting_verification.html", sender=MAIL_ADDRESS, email=email, next=next_url)


def _handle_verification(email: str | None, code: str | None, next_url: str) -> Response | str:
    if not email:
        return redirect(f"/login?error={quote_plus('No email present in verification request.')}")

    deleted = EmailAuthentication.query.filter(db.func.lower(EmailAuthentication.email) == email.lower(), EmailAuthentication.code == code).delete()
    if not deleted:
        return render_template("auth/awaiting_verification.html", sender=MAIL_ADDRESS, email=email, next=next_url)
    
    db.session.commit()

    user = User.get_or_create(email)
    login_user(user)

    response = make_response(redirect(next_url))
    response.set_cookie("i_t", user.token, max_age=2592000) # 30 * 60 * 60 * 24

    return response


@auth_blueprint.get("/login")
def login():
    return render_template("auth/login.html", next="/app")


@auth_blueprint.get("/logout")
def logout():
    logout_user()
    return redirect("/")


@auth_blueprint.get("/login/<string:provider>")
def login_provider(provider: str):
    next_url = request.args.get("next", "/app")

    if provider == "email":
        return _handle_email(request.args.get("email"), next_url)

    if provider not in ("google", "facebook"):
        return redirect(f"/login?next={next_url}")

    state = json.dumps({"next": next_url})

    redirect_uri = url_for("auth.auth_provider", provider=provider, _external=True)
    client = oauth.create_client(provider)
    assert client is not None

    return client.authorize_redirect(redirect_uri, state=state)


@auth_blueprint.route("/auth/<string:provider>")
def auth_provider(provider: str):
    if provider == "email":
        return _handle_verification(request.args.get("email"), request.args.get("code"), request.args.get("next", "/app"))

    if not provider == "google" and not provider == "facebook":
        return redirect(f"/login?error={quote_plus('Invalid provider ' + provider)}")  

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
        return redirect(f"/login?error={quote_plus('Something went wrong during authentication.')}")
    
    state = request.args.get("state", "")
    next_url = "/app"

    try:
        data = json.loads(state)
        next_url = data.get("next", "/app")
    except json.JSONDecodeError:
        pass
    
    user = User.get_or_create(email)
    login_user(user)

    response = make_response(redirect(next_url))
    response.set_cookie("i_t", user.token, max_age=2592000) # 30 * 60 * 60 * 24

    return response