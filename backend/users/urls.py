# users/urls.py
from django.urls import path
from .views import RegistrationUserView, LoginView, AddChildrenToParentView, UserListView, UserDeleteView, CurrentUserView,GoogleLoginView

urlpatterns = [
    path('register/', RegistrationUserView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('add-children/', AddChildrenToParentView.as_view(), name='add-children'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('', UserListView.as_view(), name='user-list'),  # now just /api/users/
    path('<int:pk>/', UserDeleteView.as_view(), name='user-delete'),  # now /api/users/1/
    path('google-login/', GoogleLoginView.as_view(), name='google-login'),
]
