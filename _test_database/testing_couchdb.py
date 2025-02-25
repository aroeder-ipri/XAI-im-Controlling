import couchdb
import csv

def main():
    # Connect to CouchDB
    # Update the URL to match your CouchDB host and provide the correct credentials
    couch = couchdb.Server('http://admin:password@localhost:5984/')

    # Select the database
    db = couch['click_events']

    # Fetch all documents in the database
    data_list = []
    for doc_id in db:
        doc = db[doc_id]
        print("Document ID:", doc_id)
        print("Data:", doc)

        data_list.append(doc)

    # saving data list as csv file in /home/ubuntu/XAI-im-Controlling/_test_database
    keys = data_list[0].keys() if data_list else []
    filename = "/home/ubuntu/XAI-im-Controlling/_test_database/data.csv"
    with open(filename, 'w') as output_file:
        dict_writer = csv.DictWriter(output_file, keys)
        dict_writer.writeheader()
        dict_writer.writerows(data_list)



if __name__ == "__main__":
    main()