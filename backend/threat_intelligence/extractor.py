"""
threat_intelligence/extractor.py
================================
Deterministic Entity Extractor for SeniorShield.

Extracts:
  1. URLs & Domains
  2. Indian Phone Numbers (normalized to +91XXXXXXXXXX)
  3. Email Addresses
  4. Monetary Amounts (INR, USD, etc.)
"""

import re
from urllib.parse import urlparse
from typing import List, Set, Tuple, Dict, Any
from threat_intelligence.models import Entity, EntityType, ExtractedEntities

# URL regex matching http, https, www, or domain extensions
RE_URL = re.compile(
    r"(?:https?:\/\/|www\.)[^\s\/$.?#].[^\s]*|[a-zA-Z0-9-]+\.(?:com|org|net|in|co|xyz|top|site|live|app|online|cc|ru|vip|click|info)(?:\/[^\s]*)?",
    re.IGNORECASE
)

# Indian phone number patterns (+91 followed by 10 digits, or 10 digits starting with 6,7,8,9)
RE_PHONE_IN = re.compile(
    r"(?:\+91[\-\s]?)?[6-9]\d{4}[\-\s]?\d{5}\b",
    re.IGNORECASE
)

# Email address pattern
RE_EMAIL = re.compile(
    r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
    re.IGNORECASE
)

# Currency and Monetary Amount patterns
RE_AMOUNT = re.compile(
    r"(?:(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d+)?))|(?:([\d,]+(?:\.\d+)?)\s*(?:rs\.?|inr|rupees|lakh|crore))|(?:\$\s*([\d,]+(?:\.\d+)?))",
    re.IGNORECASE
)


class EntityExtractor:
    """
    Extracts URLs, Domains, Phone Numbers, Emails, and Monetary Amounts from text.
    """

    def extract_structured(self, text: str) -> ExtractedEntities:
        """
        Extract structured entities grouped by category.
        """
        if not text or not text.strip():
            return ExtractedEntities()

        urls: List[str] = []
        domains: List[str] = []
        phone_numbers: List[str] = []
        emails: List[str] = []
        amounts: List[Dict[str, Any]] = []

        seen_urls = set()
        seen_domains = set()
        seen_phones = set()
        seen_emails = set()

        # 1. Emails
        for match in RE_EMAIL.finditer(text):
            raw_email = match.group(0).rstrip(".,;!?").lower().strip()
            if raw_email not in seen_emails:
                emails.append(raw_email)
                seen_emails.add(raw_email)

        # 2. URLs & Domains
        for match in RE_URL.finditer(text):
            raw_url = match.group(0).rstrip(".,;!?)]}")
            if "@" in raw_url:
                continue

            full_url = raw_url
            if not full_url.startswith("http://") and not full_url.startswith("https://"):
                full_url = "https://" + full_url

            try:
                parsed = urlparse(full_url)
                domain = (parsed.netloc or parsed.path.split("/")[0]).lower().strip()
                if domain.startswith("www."):
                    domain = domain[4:]
            except Exception:
                domain = raw_url.lower()

            if raw_url not in seen_urls:
                urls.append(raw_url)
                seen_urls.add(raw_url)

            if domain and domain not in seen_domains:
                domains.append(domain)
                seen_domains.add(domain)

        # 3. Phone Numbers
        for match in RE_PHONE_IN.finditer(text):
            raw_phone = match.group(0).strip()
            digits = re.sub(r"\D", "", raw_phone)
            if len(digits) == 10:
                norm_phone = f"+91{digits}"
            elif len(digits) == 12 and digits.startswith("91"):
                norm_phone = f"+{digits}"
            else:
                norm_phone = f"+{digits}"

            if norm_phone not in seen_phones:
                phone_numbers.append(norm_phone)
                seen_phones.add(norm_phone)

        # 4. Monetary Amounts
        for match in RE_AMOUNT.finditer(text):
            raw_text = match.group(0).strip()
            val_str = match.group(1) or match.group(2) or match.group(3)
            if val_str:
                clean_num = val_str.replace(",", "")
                try:
                    num_val = float(clean_num)
                    currency = "USD" if "$" in raw_text else "INR"
                    amounts.append({
                        "value": num_val,
                        "currency": currency,
                        "raw_text": raw_text
                    })
                except ValueError:
                    pass

        return ExtractedEntities(
            urls=urls,
            domains=domains,
            phone_numbers=phone_numbers,
            emails=emails,
            amounts=amounts
        )

    def extract_all(self, text: str) -> List[Entity]:
        """
        Extract flat list of Entity models for Threat Intelligence evaluation.
        """
        structured = self.extract_structured(text)
        entities: List[Entity] = []

        for url in structured.urls:
            entities.append(Entity(type=EntityType.URL.value, value=url, raw_value=url))
        for dom in structured.domains:
            entities.append(Entity(type=EntityType.DOMAIN.value, value=dom, raw_value=dom))
        for ph in structured.phone_numbers:
            entities.append(Entity(type=EntityType.PHONE.value, value=ph, raw_value=ph))
        for em in structured.emails:
            entities.append(Entity(type=EntityType.EMAIL.value, value=em, raw_value=em))

        return entities
