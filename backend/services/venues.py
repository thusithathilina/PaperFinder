"""
Central registry for supported venues.
Each entry maps a DBLP venue key to metadata used for filtering and display.
"""

VENUES: dict[str, dict] = {
    # ── Top Security 4 ────────────────────────────────────────────────────────
    "conf/ndss": {
        "short": "NDSS",
        "full": "Network and Distributed System Security Symposium",
        "group": "security",
    },
    "conf/sp": {
        "short": "S&P",
        "full": "IEEE Symposium on Security and Privacy",
        "group": "security",
    },
    "conf/uss": {
        "short": "USENIX Security",
        "full": "USENIX Security Symposium",
        "group": "security",
    },
    "conf/ccs": {
        "short": "CCS",
        "full": "ACM Conference on Computer and Communications Security",
        "group": "security",
    },
    # ── Top ML 4 ──────────────────────────────────────────────────────────────
    "conf/nips": {
        "short": "NeurIPS",
        "full": "Conference on Neural Information Processing Systems",
        "group": "ml",
    },
    "conf/icml": {
        "short": "ICML",
        "full": "International Conference on Machine Learning",
        "group": "ml",
    },
    "conf/iclr": {
        "short": "ICLR",
        "full": "International Conference on Learning Representations",
        "group": "ml",
    },
    "conf/aaai": {
        "short": "AAAI",
        "full": "AAAI Conference on Artificial Intelligence",
        "group": "ml",
    },
}

SECURITY_VENUES = [k for k, v in VENUES.items() if v["group"] == "security"]
ML_VENUES      = [k for k, v in VENUES.items() if v["group"] == "ml"]
ALL_VENUE_KEYS = list(VENUES.keys())


def get_venue_group(venue_key: str) -> str | None:
    return VENUES.get(venue_key, {}).get("group")


def get_short_name(venue_key: str) -> str:
    return VENUES.get(venue_key, {}).get("short", venue_key)
