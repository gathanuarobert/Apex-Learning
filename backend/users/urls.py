from django.urls import path
from .views import (
    RegistrationUserView, LoginView, AddChildrenToParentView,
    UserListView, UserDeleteView, CurrentUserView, GoogleLoginView,
    UpdateUserView, ChangePasswordView, GuestStatusView,
    ForgotPasswordView, ResetPasswordView,
)

urlpatterns = [
    path('register/',           RegistrationUserView.as_view(),   name='register'),
    path('login/',              LoginView.as_view(),               name='login'),
    path('add-children/',       AddChildrenToParentView.as_view(), name='add-children'),
    path('me/',                 CurrentUserView.as_view(),         name='current-user'),
    path('me/update/',          UpdateUserView.as_view(),          name='update-user'),
    path('me/change-password/', ChangePasswordView.as_view(),      name='change-password'),
    path('google-login/',       GoogleLoginView.as_view(),         name='google-login'),
    path('guest-status/',       GuestStatusView.as_view(),         name='guest-status'),
    path('forgot-password/',    ForgotPasswordView.as_view(),      name='forgot-password'),
    path('reset-password/',     ResetPasswordView.as_view(),       name='reset-password'),
    path('',                    UserListView.as_view(),            name='user-list'),
    path('<int:pk>/',           UserDeleteView.as_view(),          name='user-delete'),
]