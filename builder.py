"""
A build script for copying source files to bin dir.
"""
import os
from os.path import join
import shutil

def main():
    build = r'..\bin'
    files = 'asteroids.css  asteroids.html asteroids.js asteroids.txt'.split()
    srcdir = os.getcwd()
    builddir = os.path.normpath(join(srcdir, build))
    
    # copy files (will overwrite existing files)
    for f in files:
        shutil.copy(join(srcdir, f), builddir)
        
    # rename asteroids.html to index.html
    shutil.move(join(builddir, 'asteroids.html'), join(builddir, 'index.html'))
    
    
if __name__ == '__main__':
    main()