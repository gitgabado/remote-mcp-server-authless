
# IATI Datastore Knowledge Base

## 1. Frequently Asked Questions (FAQs)

### Why is my data missing from the Datastore?
The IATI Datastore includes all IATI data known to the IATI Registry that is version 2.0 or above and conforms to the IATI XML Schema. Files not conforming to the schema are marked as critically invalid in the IATI Validator.

### When is the IATI Datastore updated?
The Datastore updates dynamically as new data becomes available via the IATI Registry. New files may take up to 24 hours to appear.

### How do I search for a specific phrase or identifier?
To search for an exact phrase, enclose it in quotation marks. For example, searching for "rabbit production" will return results containing that exact phrase, whereas searching without quotes will return results containing either "rabbit" or "production".

### How does the IATI Datastore clean IATI data?
The IATI Datastore indexes and represents data exactly as published, without transformations or added metadata.

---

## 2. Simple Search

The homepage of [Datastore Search](https://datastore.iatistandard.org) contains the "Simple Search" bar. This performs a text search on every narrative element within IATI activity data.

### Search Operators

| Operator | Function | Example |
|----------|----------|---------|
| `?` | Wildcard, one character | `latin?` matches `latino`, `latina` |
| `*` | Wildcard, many characters | `latin*` matches `latin`, `latino`, `latina`, etc. |
| `""` | Exact phrase | `"inter-agency"` |
| `AND` | Boolean AND (also `&&`) | `Congo AND Democratic` |
| `NOT` | Boolean NOT (`!` or `-`) | `Congo NOT Democratic` |
| `OR` | Boolean OR (`||`) | `Covid OR vaccine` |
| `+` | Required term | `foreign domestic +aid` |
| `~` | Fuzzy or proximity search | `"protection rights"~20` |
| `^` | Boost relevance | `covid^4 vaccine` |
| `()` | Group terms | `(Congo AND Democratic) OR (Covid AND vaccine)` |

### Downloading Results

**Levels:**
- Activity: One row per activity.
- Transaction: One row per transaction, repeating activity-level info.
- Budget: One row per budget, repeating activity-level info.

**Formats:**
- XML: IATI-standard format (activity only).
- JSON: Flattened data.
- CSV: Flattened export (comma-separated).
- Excel: Flattened, Excel-safe (pipe `|` separated, truncated if too long).

---

## 3. Advanced Search

Access the advanced search via the "Switch to Advanced Search" button on the [Datastore Search homepage](https://datastore.iatistandard.org). This allows querying of all elements within IATI activity data.

### Example Advanced Query
You can query:
- `recipient_country_code:KE`
- `sector_code:112*`
- `activity_date_start_iso_date:[2023-01-01T00:00:00Z TO 2023-12-31T23:59:59Z]`
- `activity_status_code:(2 3 4)`

Combine filters with `AND` for precise control.

See full [Advanced Search Documentation](https://docs.datastore.iatistandard.org/en/latest/adv_search/) and [Example Queries](https://docs.datastore.iatistandard.org/en/latest/adv_example/).
