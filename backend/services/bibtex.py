"""
BibTeX generation service.

Produces @inproceedings entries — appropriate for all supported venues
(they are all conference proceedings).
"""

from models.paper import Paper


def _make_cite_key(paper: Paper) -> str:
    """
    Generate a readable cite key: firstAuthorLastName + year + firstTitleWord
    e.g.  smith2023adversarial
    """
    # First author last name
    if paper.authors:
        last_name = paper.authors[0].split()[-1].lower()
    else:
        last_name = "unknown"

    # First meaningful word from title (skip short words)
    stop_words = {"a", "an", "the", "on", "in", "of", "for", "with", "and", "or"}
    title_words = [w.lower() for w in paper.title.split() if w.lower() not in stop_words]
    first_word = title_words[0] if title_words else "paper"

    # Strip non-alphanumeric characters
    last_name = "".join(c for c in last_name if c.isalnum())
    first_word = "".join(c for c in first_word if c.isalnum())

    return f"{last_name}{paper.year}{first_word}"


def _escape_bibtex(text: str) -> str:
    """Escape characters that have special meaning in BibTeX."""
    replacements = {
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\textasciicircum{}",
    }
    for char, escaped in replacements.items():
        text = text.replace(char, escaped)
    return text


def _format_authors(authors: list[str]) -> str:
    """Format author list as 'Last, First and Last, First ...'"""
    return " and ".join(authors)


def paper_to_bibtex(paper: Paper) -> str:
    """Convert a single Paper to a BibTeX @inproceedings entry."""
    cite_key = _make_cite_key(paper)
    authors_str = _format_authors(paper.authors)

    lines = [
        f"@inproceedings{{{cite_key},",
        f"  author    = {{{_escape_bibtex(authors_str)}}},",
        f"  title     = {{{_escape_bibtex(paper.title)}}},",
        f"  booktitle = {{{_escape_bibtex(paper.venue)}}},",
        f"  year      = {{{paper.year}}},",
    ]

    if paper.doi:
        lines.append(f"  doi       = {{{paper.doi}}},")
    if paper.url:
        lines.append(f"  url       = {{{paper.url}}},")

    lines.append("}")

    return "\n".join(lines)


def papers_to_bibtex(papers: list[Paper]) -> str:
    """Convert a list of papers to a full .bib file string."""
    entries = [paper_to_bibtex(p) for p in papers]
    return "\n\n".join(entries)
