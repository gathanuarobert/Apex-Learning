"""
Django settings for apex_learning project.
"""

from pathlib import Path
import os
import os
import dj_database_url
from dotenv import load_dotenv
from datetime import timedelta


BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env
load_dotenv(BASE_DIR / ".env")
DATABASE_URL = os.getenv("DATABASE_URL")

# -------------------------------------------------------------------
# SECURITY
# -------------------------------------------------------------------
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-c-+p_hr9_1r1)!o#(3h#d+dz*uxfr73d07$%3&sl!b%x3no1j4')
DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',') + [
    'thunderous-accordable-marivel.ngrok-free.dev',
    'apexlearning.co.ke',
    'www.apexlearning.co.ke',
]

CSRF_TRUSTED_ORIGINS = os.getenv(
    'CSRF_TRUSTED_ORIGINS',
    'https://thunderous-accordable-marivel.ngrok-free.dev'
).split(',')

# -------------------------------------------------------------------
# APPLICATIONS
# -------------------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',  # ✅ Required for refresh token blacklisting
    'corsheaders',
    # Custom apps
    'users',
    'resources',
    'payments',
    'seo',
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    'django.middleware.security.SecurityMiddleware',
    "whitenoise.middleware.WhiteNoiseMiddleware",
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'apex_learning.urls'
AUTH_USER_MODEL = 'users.User'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'apex_learning.wsgi.application'

# -------------------------------------------------------------------
# DATABASE
# -------------------------------------------------------------------
DATABASES = {
    'default': dj_database_url.parse(
        DATABASE_URL,
        conn_max_age=600
    )
}

# -------------------------------------------------------------------
# JWT & REST FRAMEWORK
# -------------------------------------------------------------------
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':    timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME':   timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':    True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES':        ('Bearer',),
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        # ✅ Reads JWT from HttpOnly cookie instead of Authorization header
        'users.authentication.CookieJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# -------------------------------------------------------------------
# JWT AUTH COOKIES
# -------------------------------------------------------------------
JWT_AUTH_COOKIE          = 'apex_access'    # Name of the access token cookie
JWT_AUTH_REFRESH_COOKIE  = 'apex_refresh'   # Name of the refresh token cookie
JWT_AUTH_COOKIE_SAMESITE = os.getenv('JWT_AUTH_COOKIE_SAMESITE', 'Lax')

CSRF_COOKIE_HTTPONLY = False  # Must be False so JS can read csrftoken cookie

# -------------------------------------------------------------------
# CORS
# -------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ALLOWED_ORIGINS',
     'http://localhost:5173,http://127.0.0.1:5173',
).split(',')
if DEBUG:
    CORS_ALLOWED_ORIGINS += [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
    ]
    # Deduplicate
    CORS_ALLOWED_ORIGINS = list(set(CORS_ALLOWED_ORIGINS))
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'cache-control',
    'pragma',
    'expires',
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# -------------------------------------------------------------------
# SECURITY HEADERS (production only)
# -------------------------------------------------------------------
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT     = True
    SESSION_COOKIE_SECURE   = True
    CSRF_COOKIE_SECURE      = True
    SESSION_COOKIE_SAMESITE = 'None'
    CSRF_COOKIE_SAMESITE    = 'None'

# -------------------------------------------------------------------
# RECAPTCHA
# -------------------------------------------------------------------
RECAPTCHA_SECRET_KEY = os.getenv("RECAPTCHA_SECRET_KEY")

# -------------------------------------------------------------------
# MEDIA FILES
# -------------------------------------------------------------------
MEDIA_URL  = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# -------------------------------------------------------------------
# STATIC FILES
# -------------------------------------------------------------------
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# -------------------------------------------------------------------
# CACHE CONTROL
# -------------------------------------------------------------------
CACHE_MIDDLEWARE_SECONDS = 0

# -------------------------------------------------------------------
# PASSWORD VALIDATION
# -------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# -------------------------------------------------------------------
# M-PESA CONFIG
# -------------------------------------------------------------------
MPESA_ENV            = os.getenv("MPESA_ENV", "sandbox")
MPESA_CONSUMER_KEY   = os.getenv("MPESA_CONSUMER_KEY")
MPESA_CONSUMER_SECRET = os.getenv("MPESA_CONSUMER_SECRET")
MPESA_SHORTCODE      = os.getenv("MPESA_SHORTCODE")
MPESA_PASSKEY        = os.getenv("MPESA_PASSKEY")
MPESA_CALLBACK_URL   = os.getenv("MPESA_CALLBACK_URL")

# -------------------------------------------------------------------
# INTERNATIONALISATION
# -------------------------------------------------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'UTC'
USE_I18N      = True
USE_TZ        = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# -------------------------------------------------------------------
# EMAIL
# -------------------------------------------------------------------
EMAIL_BACKEND     = 'django.core.mail.backends.console.EmailBackend'
DEFAULT_FROM_EMAIL = 'no-reply@apexlearning.local'

print("DATABASE_URL:", os.getenv("DATABASE_URL"))
print("CORS_ALLOWED_ORIGINS RAW:", os.getenv('CORS_ALLOWED_ORIGINS'))
print("DEBUG:", os.getenv('DEBUG'))