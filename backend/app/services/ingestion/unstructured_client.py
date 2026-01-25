from __future__ import annotations

from typing import Any, Dict, List, Optional
import os
import requests

from app.core.config import settings


class UnstructuredError(RuntimeError):
    pass


def partition_pdf(
    pdf_path: str,
    *,
    strategy: Optional[str] = None,
    coordinates: bool = False,
    include_page_breaks: bool = False,
) -> List[Dict[str, Any]]:
    """
    Calls the Unstructured 'Partition' endpoint and returns the list of elements.

    Uses multipart/form-data with header 'unstructured-api-key'.
    """
    url = settings.unstructured_api_url
    api_key = settings.unstructured_api_key

    if not api_key:
        raise UnstructuredError("UNSTRUCTURED_API_KEY is not set")

    headers = {"unstructured-api-key": api_key}

    # Unstructured expects multipart form-data; 'files' field is used in their examples. :contentReference[oaicite:1]{index=1}
    with open(pdf_path, "rb") as f:
        files = {"files": (os.path.basename(pdf_path), f, "application/pdf")}
        data = {
            "output_format": "application/json",
            "coordinates": str(coordinates).lower(),
            "include_page_breaks": str(include_page_breaks).lower(),
        }
        # strategy is optional; only include if provided
        if strategy:
            data["strategy"] = strategy

        print("Unstructured URL:", url)
        resp = requests.post(url, headers=headers, files=files, data=data, timeout=120)

    if resp.status_code >= 400:
        raise UnstructuredError(f"Unstructured error {resp.status_code}: {resp.text[:500]}")

    # Response is JSON elements: type, element_id, text, metadata... :contentReference[oaicite:2]{index=2}
    return resp.json()