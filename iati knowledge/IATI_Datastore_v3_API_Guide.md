
# 📘 IATI Datastore v3 API Query Guide

This guide provides structured guidance on how to form Datastore v3 API queries for accessing IATI activity, transaction, or budget data.

---

## 🔐 Access Requirements

- Queries must include a **subscription key** (API key).
- Access via IATI API Gateway: `https://api.iatistandard.org/datastore`

---

## 🔧 Available Endpoints

Each endpoint returns all related activity data:

- `/activity/select?`
- `/transaction/select?`
- `/budget/select?`

Use the `collection` parameter:
- `collection=activity`
- `collection=transaction`
- `collection=budget`

---

## 🧠 Query Basics

Start filters with `q=`. Combine filters using:
- `AND`, `OR`, `NOT`, `+`

---

## 🧾 Attribute Code Examples

- Single code: `q=sector_code:11110`
- Multiple codes: `q=recipient_country_code:(UG TZ)`
- OR example: `q=sector_code:11110 OR transaction_sector_code:11110`
- AND example: `q=recipient_country_code:UG AND sector_code:11110`
- NOT example: `q=recipient_country_code:UG NOT sector_code:11110`

---

## 💬 Narrative Text Searches

- Specific field: `q=description_narrative:rabbit`
- Multiple fields: `q=title_narrative:rabbit OR description_narrative:rabbit`
- Two words: `q=title_narrative:(rabbit AND production)`
- Phrase: `q=title_narrative:"rabbit production"`

### 🔠 Wildcards

- `*`: wildcard (e.g. `apple*`)
- `?`: single character (e.g. `te?t`)
- **Note:** *Do not quote wildcard terms.*

---

## 📆 Date & Financial Filters

- Max value: `q=transaction_value:[* TO 10000]`
- From date: `q=activity_date_iso_date:[2021-01-01T00:00:00Z TO *]`

> Note: `activity_date_iso_date` must be used for filtering start or end dates.

---

## 📦 Return Specific Fields

Use `fl=`:
```
&fl=description_narrative,sector_code
```

---

## 💾 Format Output

Use `wt=`:
- `&wt=json`
- `&wt=xml`
- `&wt=csv`

---

## 📊 Number of Rows

- Default: 10
- Set rows: `&rows=50`
- Set offset: `&start=0`

---

## 🧱 Element Naming Convention

| IATI Element                        | API Name                                 |
|------------------------------------|------------------------------------------|
| `iati-identifier`                  | `iati_identifier`                        |
| `transaction/value`               | `transaction_value`                      |
| `transaction/value/@currency`     | `transaction_value_currency`             |
| `transaction/description/narrative/@xml:lang` | `transaction_description_narrative_xml_lang` |

---

## 📚 Example 1: National NGOs in the Philippines

```
GET https://api.iatistandard.org/datastore/budget/select
?q=reporting_org_type:22 AND (recipient_country_code:PH OR transaction_recipient_country_code:PH)
&rows=300
&wt=json
&fl=iati_identifier,reporting_org_type,recipient_country_code
```

---

## 📚 Example 2: Teacher Training in Uganda/Kenya (since 2021)

```
GET https://api.iatistandard.org/datastore/activity/select
?q=(sector_code:11130 OR transaction_sector_code:11130)
AND (recipient_country_code:(UG KE) OR transaction_recipient_country_code:(UG KE))
AND activity_date_iso_date:[2021-01-01T00:00:00Z TO *]
&rows=300
&wt=json
&fl=participating_org_ref,participating_org_narrative
```

---

## 🔤 Character Encodings

| Character | Encoded |
|----------|---------|
| `"`      | `%22`   |
| ` `      | `%20`   |
| `:`      | `%3A`   |
| `,`      | `%2C`   |
| `[`      | `%5B`   |
| `]`      | `%5D`   |

---

## 📎 Additional References

- [Datastore v3 API Contract](https://developer.iatistandard.org/api-details#api=datastore)
- [SOLR Documentation](https://solr.apache.org/guide/)
- [API Gateway Docs](https://developer.iatistandard.org)

---

This guide helps form robust queries and understand API constraints for accessing structured IATI data across multiple collections and filters.
