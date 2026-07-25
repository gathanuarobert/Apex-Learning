# resources/pagination.py
from rest_framework.pagination import PageNumberPagination


class StandardResultsPagination(PageNumberPagination):
    """
    Default pagination for resource list endpoints. Allows the client to
    request a different page size via ?page_size=, capped at max_page_size
    so nobody can force an unbounded response (e.g. ?page_size=999999).
    Used as-is for normal browsing (default page_size), and with a larger
    page_size for the global search dropdown, which wants more results in
    a single request rather than paging through a small dropdown.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100