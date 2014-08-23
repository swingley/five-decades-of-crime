#!/usr/bin/python

import glob, re

# Get a list of all files.
all = glob.glob("raw/*.csv")
filter = re.compile("\d{4}|year", re.IGNORECASE)
for f in all:
  with open(f) as data:
    content = data.readlines()
  outname = content[3].replace(" ", "-").lower().strip() + ".csv"
  out = open("data/" + outname, "w")
  content = content[3:]
  # Check if line starts with "year" or a year
  crime = [ re.sub(" +", " ", line) for line in content if filter.match(line) ]
  # Write to a file
  for c in crime:
    out.write(c)
  out.close()

print "Finished."