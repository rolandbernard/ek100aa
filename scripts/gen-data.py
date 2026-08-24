#!/usr/bin/env python
# This is a small script that downloads the training and validation annotation
# data and merges it into one compact .csv file for consumption by the application.

import csv
from itertools import groupby
import pandas as pd

out = "public/data"
urls = [
    "https://github.com/epic-kitchens/epic-kitchens-100-annotations/raw/refs/heads/master/EPIC_100_validation.csv",
    "https://github.com/epic-kitchens/epic-kitchens-100-annotations/raw/refs/heads/master/EPIC_100_train.csv",
]
samples = []
groups = []

for url in urls:
    df = pd.read_csv(url)
    for col in ["start_timestamp", "stop_timestamp"]:
        df[col] = pd.to_timedelta(df[col]).dt.total_seconds()
    for record in df.itertuples():
        samples.append([record.narration_id, record.start_timestamp,
                       record.stop_timestamp, record.narration])

for key, group in groupby(samples, key=lambda x: x[0][:x[0].rfind("_")]):
    max_idx = 0
    with open(f"{out}/{key}.csv", "w", newline="", encoding="utf-8") as outfile:
        writer = csv.writer(outfile)
        for sample in group:
            max_idx = max(max_idx, int(sample[0][sample[0].rfind("_") + 1:]))
            writer.writerow(sample)
    groups.append([key, max_idx])

with open(f"{out}/ID.csv", "w", newline="", encoding="utf-8") as outfile:
    writer = csv.writer(outfile)
    for group in groups:
        writer.writerow(group)
