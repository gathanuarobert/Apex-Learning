# 🎓 Apex Learning – Django Backend

Apex Learning is an e-learning platform backend built with Django. It provides APIs and admin management for:

- User accounts
- Educational resources (notes, past papers, news)
- Store products (with M-Pesa payment integration)

---

## 📚 Project Structure 

```bash
backend/
├── apex_learning/       # Project settings
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── users/               # App for custom user logic
│   └── models.py
│
├── resources/           # App for notes, past papers, news
│   └── models.py
│
├── store/               # App for products & orders
│   └── models.py
│
├── payments/            # App for M-Pesa integration
│   └── models.py
│
├── manage.py            # Django entry point
└── README.md            # You’re here!

```bash

🛠️ **Initial Setup**

Follow these steps after cloning the repo:

1. **Clone the repository**
    ```
    git clone https://github.com/YOUR_USERNAME/apex-learning.git
    cd apex-learning/backend
    ```

2. **Create and activate a virtual environment**
    ```
    python -m venv venv
    source venv/bin/activate      # Mac/Linux
    # OR
    venv\Scripts\activate         # Windows
    ```

3. **Install dependencies**
    ```
    pip install -r requirements.txt
    ```
    > If `requirements.txt` is missing, generate it with:
    ```
    pip freeze > requirements.txt
    ```

---

🧱 **Working with the Database**

- **Run migrations**
    ```
    python manage.py makemigrations
    python manage.py migrate
    ```

- **Create a superuser (Optional but useful)**
    ```
    python manage.py createsuperuser
    ```

- **Run the development server**
    ```
    python manage.py runserver
    ```

---

> **Current date:** July 18, 2025

---

**Happy coding! 🚀**
