import json

class JsonExtractor:
    @classmethod
    def from_file(self, file_path):
        with open(file_path, 'r') as file:
            content_json = json.loads(file.read())

        return content_json
