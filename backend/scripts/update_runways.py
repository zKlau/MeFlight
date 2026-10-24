import csv
import io
import urllib.request
from pathlib import Path

SOURCE_URL = "https://davidmegginson.github.io/ourairports-data/runways.csv"
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "data" / "runways.csv"
CLOSED = "1"
COORDINATE_DECIMALS = 6
OUTPUT_COLUMNS = (
    "airport_ident",
    "le_ident",
    "le_latitude_deg",
    "le_longitude_deg",
    "he_ident",
    "he_latitude_deg",
    "he_longitude_deg",
    "length_ft",
    "width_ft",
    "surface",
    "lighted",
)
COORDINATE_COLUMNS = ("le_latitude_deg", "le_longitude_deg", "he_latitude_deg", "he_longitude_deg")

def has_both_ends(row: dict) -> bool:
    return all(row[column] for column in COORDINATE_COLUMNS) and bool(row["le_ident"]) and bool(row["he_ident"])

def trimmed(row: dict) -> dict:
    output = {column: row[column] for column in OUTPUT_COLUMNS}
    for column in COORDINATE_COLUMNS:
        output[column] = str(round(float(row[column]), COORDINATE_DECIMALS))
    return output

def main() -> None:
    with urllib.request.urlopen(SOURCE_URL) as response:
        text = response.read().decode("utf-8")

    rows = [trimmed(row) for row in csv.DictReader(io.StringIO(text)) if row["closed"] != CLOSED and has_both_ends(row)]

    with OUTPUT_PATH.open("w", encoding="utf-8", newline="") as output:
        writer = csv.DictWriter(output, fieldnames=OUTPUT_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} runways to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
