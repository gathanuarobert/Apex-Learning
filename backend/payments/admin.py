from django.contrib import admin
from .models import Payment, Wallet, Transaction

# Register your models here.
admin.site.register(Payment)
admin.site.register(Wallet)
admin.site.register(Transaction)