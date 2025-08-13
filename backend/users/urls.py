from django.urls import path
from .views import RegistrationUserView, LoginView, AddChildrenToParentView

urlpatterns = [
    path('register/', RegistrationUserView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('add-children/', AddChildrenToParentView.as_view(), name='add-children'),
]
