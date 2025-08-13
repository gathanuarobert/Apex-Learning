import django.db.models.deletion
import django.utils.timezone
import users.models
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('name', models.CharField(blank=True, default='', max_length=30)),
                ('role', models.CharField(
                    blank=True,
                    choices=[
                        ('student', 'Student'),
                        ('teacher', 'Teacher'),
                        ('parent', 'Parent'),
                        ('public', 'General Public')
                    ],
                    max_length=10,
                    null=True
                )),
                ('is_active', models.BooleanField(default=True)),
                ('is_superuser', models.BooleanField(default=False)),
                ('is_staff', models.BooleanField(default=False)),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now)),
                ('last_login', models.DateTimeField(blank=True, null=True)),
                ('groups', models.ManyToManyField(
                    blank=True,
                    help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
                    related_name='user_set',
                    related_query_name='user',
                    to='auth.group',
                    verbose_name='groups'
                )),
                ('user_permissions', models.ManyToManyField(
                    blank=True,
                    help_text='Specific permissions for this user.',
                    related_name='user_set',
                    related_query_name='user',
                    to='auth.permission',
                    verbose_name='user permissions'
                )),
            ],
            options={
                'verbose_name': 'User',
                'verbose_name_plural': 'Users',
            },
            managers=[
                ('objects', users.models.CustomUserManager()),
            ],
        ),
        migrations.CreateModel(
            name='StudentProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('grade', models.CharField(blank=True, default='', max_length=10)),
                ('user', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='student_profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='ParentProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('user', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='parent_profile', to=settings.AUTH_USER_MODEL)),
                ('children', models.ManyToManyField(blank=True, related_name='parents', to='users.studentprofile')),
            ],
        ),
        migrations.CreateModel(
            name='TeacherProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('subject', models.CharField(blank=True, default='', max_length=100)),
                ('user', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='teacher_profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='PublicProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('user', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='public_profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
