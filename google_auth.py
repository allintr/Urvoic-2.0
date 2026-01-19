import json
import os
import secrets

import requests
from flask import Blueprint, redirect, request, url_for, current_app
from flask_login import login_user, logout_user, login_required
from oauthlib.oauth2 import WebApplicationClient

GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"

google_auth = Blueprint("google_auth", __name__)

def get_google_client():
    client_id = os.environ.get("GOOGLE_OAUTH_CLIENT_ID")
    if not client_id:
        return None
    return WebApplicationClient(client_id)

def get_redirect_url():
    dev_domain = os.environ.get("REPLIT_DEV_DOMAIN", "")
    if dev_domain:
        return f'https://{dev_domain}/google_login/callback'
    return None

@google_auth.route("/google_login")
def login():
    client_id = os.environ.get("GOOGLE_OAUTH_CLIENT_ID")
    if not client_id:
        return "Google OAuth not configured", 400
    
    client = WebApplicationClient(client_id)
    google_provider_cfg = requests.get(GOOGLE_DISCOVERY_URL).json()
    authorization_endpoint = google_provider_cfg["authorization_endpoint"]

    request_uri = client.prepare_request_uri(
        authorization_endpoint,
        redirect_uri=request.base_url.replace("http://", "https://") + "/callback",
        scope=["openid", "email", "profile"],
    )
    return redirect(request_uri)


@google_auth.route("/google_login/callback")
def callback():
    from app import db, User
    
    client_id = os.environ.get("GOOGLE_OAUTH_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        return "Google OAuth not configured", 400
    
    client = WebApplicationClient(client_id)
    code = request.args.get("code")
    google_provider_cfg = requests.get(GOOGLE_DISCOVERY_URL).json()
    token_endpoint = google_provider_cfg["token_endpoint"]

    token_url, headers, body = client.prepare_token_request(
        token_endpoint,
        authorization_response=request.url.replace("http://", "https://"),
        redirect_url=request.base_url.replace("http://", "https://"),
        code=code,
    )
    token_response = requests.post(
        token_url,
        headers=headers,
        data=body,
        auth=(client_id, client_secret),
    )

    client.parse_request_body_response(json.dumps(token_response.json()))

    userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]
    uri, headers, body = client.add_token(userinfo_endpoint)
    userinfo_response = requests.get(uri, headers=headers, data=body)

    userinfo = userinfo_response.json()
    if userinfo.get("email_verified"):
        users_email = userinfo["email"]
        users_name = userinfo.get("name", userinfo.get("given_name", "User"))
    else:
        return "User email not available or not verified by Google.", 400

    user = User.query.filter_by(email=users_email).first()
    if not user:
        user = User(
            email=users_email,
            full_name=users_name,
            phone="",
            user_type="resident",
            role="resident"
        )
        user.set_password(secrets.token_hex(16))
        db.session.add(user)
        db.session.commit()

    login_user(user, remember=True)

    if user.user_type == 'business':
        return redirect('/dashboard/business')
    elif user.role == 'admin':
        return redirect('/dashboard/admin')
    elif user.role == 'guard':
        return redirect('/dashboard/guard')
    else:
        return redirect('/dashboard/resident')
