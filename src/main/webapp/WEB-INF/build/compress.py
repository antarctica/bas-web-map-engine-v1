#!/usr/bin/python

# Minify and concatenate script for all objects listed in a config file

import os
import sys
import subprocess

yuicompressor = os.path.abspath("./yuicompressor/build/yuicompressor-2.4.8.jar")

buildjs = os.path.abspath("../../static/buildjs")
print "Write bundled js to " + buildjs
if not os.path.exists(buildjs):
    os.makedirs(buildjs)
else:
    os.remove(os.path.join(buildjs, "alljs.js"))
buildcss = os.path.abspath("../../static/buildcss")
print "Write bundled css to " + buildcss
if not os.path.exists(buildcss):
    os.makedirs(buildcss)
else:
    os.remove(os.path.join(buildcss, "allcss.css"));
concjs = open(os.path.join(buildjs, "alljs.js"), "a")
conccss = open(os.path.join(buildcss, "allcss.css"), "a")

# Files to completely ignore i.e. no minify or concatenate
ignorejs = ["bootstrap-treeview.js", "ol.debug.js"]
ignorecss = []
# Files to add to the js bundle but don't do any further minification (anything .min.js will automatically be skipped)
skipminjs = ["jquery.js", "prettify.js", "proj4.js"]
# As above for css
skipmincss = []

def fconcat(root, file):
    if (file not in ignorejs and file not in ignorecss):
        if (root):
            fpath = os.path.join(root, file)
        else:
            fpath = file
        if (file.endswith(".css")):
            outfile = conccss
            skipmin = (".min." in file) or (os.path.basename(file) in skipmincss)                                                
        elif (file.endswith(".js")):
            outfile = concjs
            skipmin = (".min." in file) or (os.path.basename(file) in skipminjs)
        if (not skipmin): 
            print "Minifying " + fpath
            proc = subprocess.Popen(["java", "-jar", yuicompressor, fpath], stdout=subprocess.PIPE)
            outfile.write(proc.communicate()[0])
        else:
            print "Skip minify for " + fpath
            infile = open(fpath, "r")
            filestr = infile.read()
            outfile.write(filestr)
    else:
        print "Ignore " + file

def main():
    print "*** Starting"    
    try:
        tocompress = open("compress.txt")
        for line in iter(tocompress):            
            path = os.path.abspath("../../static/" + line.rstrip("\r\n"))
            if (path.endswith(".js")):
                fconcat("", path)
            elif (path.endswith(".css")):
                fconcat("", path)
            else:
                for root, dirs, files in os.walk(path):
                    for file in files:
                        fconcat(root, file)                        
        tocompress.close()
    except:
        print "Exception ", sys.exc_info()[0]
    concjs.close()
    conccss.close()
    print "*** Finished"

if __name__ == "__main__":
    sys.exit(main())
