import json

from hashlib import sha256
from argparse import ArgumentParser
from pathlib import Path
from datetime import datetime

if __name__ == "__main__":
    sha256sum = sha256()
    buffer_size = 65536  # 64kb

    parser = ArgumentParser()
    parser.add_argument('box_path', help='Path to the box file being added as a new version, [YYYY-MM-DD] will be '
                                         'replaced with todays date')
    parser.add_argument('metadata_path', help='Path to the box metadata file to be updated')
    parser.add_argument('version', help='Version of the box to be added or amended')
    parser.add_argument('provider', choices=['virtualbox'], help='Provider of the box to be added or amended')
    parser.add_argument('uri', help='URI the box will be available at, [YYYY-MM-DD] will be replaced with todays date')
    args = parser.parse_args()

    # check box_path and metadata path_both exist
    box_path = Path(str(args.box_path).replace('[YYYY-MM-DD]', datetime.now().date().isoformat()))
    if not box_path.is_file():
        raise FileNotFoundError
    metadata_path = Path(args.metadata_path)
    if not metadata_path.is_file():
        raise FileNotFoundError

    # hash the contents of box_path
    with open(box_path, 'rb') as box_file:
        while True:
            data = box_file.read(buffer_size)
            if not data:
                break
            sha256sum.update(data)

    version = {
        "version": args.version,
        "providers": [
            {
                "name": args.provider,
                "url": str(args.uri).replace('[YYYY-MM-DD]', datetime.now().date().isoformat()),
                "checksum_type": "sha256",
                "checksum": sha256sum.hexdigest()
            }
        ]
    }

    metadata_file = open(metadata_path, 'r')
    metadata = json.load(metadata_file)
    metadata_file.close()

    if 'versions' in metadata:
        replaced = False
        for index, _version in enumerate(metadata['versions']):
            if _version['version'] == args.version:
                metadata['versions'][index] = version
                replaced = True
        if not replaced:
            metadata['versions'].append(version)

    metadata_file = open(metadata_path, 'w')
    json.dump(metadata, metadata_file, indent=4)
    metadata_file.close()

    print(json.dumps(metadata, indent=4))
    print('ok')
