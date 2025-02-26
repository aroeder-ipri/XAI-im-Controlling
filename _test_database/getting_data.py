import couchdb
import csv

def main():
    # Connect to CouchDB
    # Update the URL to match your CouchDB host and provide the correct credentials
    couch = couchdb.Server('http://admin:password@localhost:5984/')

    # Select the database
    db = couch['click_events']

    data_list = []
    # Fetch all documents in the database
    for doc_id in db:
        doc = db[doc_id]
        print("Document ID:", doc_id)
        print("Data:", doc)
        data_list.append(doc)

    # Convert the list of dictionaries to a DataFrame
    if not data_list:
        print("Keine Daten gefunden.")
        return

    # CSV-Datei schreiben
    csv_file = "/home/ubuntu/XAI-im-Controlling/_test_database/click_events.csv"

    # Header aus den Keys des ersten Dokuments ableiten
    fieldnames = list(data_list[0].keys())

    with open(csv_file, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)

        writer.writeheader()  # Schreibe die Header-Zeile
        writer.writerows(data_list)  # Schreibe die Datenzeilen

    print(f"Daten wurden als {csv_file} gespeichert.")



if __name__ == "__main__":
    main()