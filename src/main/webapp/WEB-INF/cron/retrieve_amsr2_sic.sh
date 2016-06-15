#!/bin/bash

###################################################################################################
# Bremen Sea Ice Concentration chart retrieval script, courtesy of Polar View                     #
# Version 1.0 15/06/2016 David Herbert, BAS                                                       #
# darb1@bas.ac.uk                                                                                 #
###################################################################################################
# Retrieves a processed AMSR2 SIC product created by Polar View, reprojects it to EPSG:3031
# and calls a Java application (update_mosaic.jar) which handles the publication of the
# data as a Geoserver Image Mosaic store.  This store is backed by a PostGIS table defined in
# the Postgres database on localhost; this should not be edited manually as it is automatically
# regenerated every time this script runs (there will usually be new images to ingest into the
# mosaic).
#
# Using the Image Mosaic plugin docs can be found at:
# http://docs.geoserver.org/stable/en/user/tutorials/image_mosaic_plugin/imagemosaic.html
# In particular the significance of the files:
#  datastore.properties
#  indexer.properties
#  timeregex.properties
# within the mosaic product directory ($HOME/geoserver_data/coverages/amsr2_sic)
# DO NOT rename this directory or move it - the mosaic regeneration will break!
###################################################################################################

# This script is expected to run as a cron job with the entry:
# 00 8 * * * /local/users/addb/bin/retrieve_amsr2_sic.sh >> /local/users/addb/bin/retrieve_amsr2_sic.log 2>&1

# Download landing directory
landing_dir=/tmp/

# Processed product directory
product_dir=$HOME"/geoserver_data/coverages/amsr2_sic/"

# This is unhelpfully in a Polar Stereographic projection whose latitude of true scale is -70 (not -71)
amsr2_sic_url=http://www.polarview.aq/images/27_AMSR2/antarctic_AMSR2.tif

# Start of today
start_today=$(date +'%b %d %Y')

# Filename for today's product
today_product="antarctic_amsr2_"$(date +'%Y%m%d')".tif"
echo "Starting - today's SIC product is "$today_product
if [ ! -s "${product_dir}${today_product}" ]; then
    # Product not found or is empty - see if it can be downloaded
    echo "Product not found or zero length - downloading from PVAN at "$amsr2_sic_url"..."
    curl -z "${start_today}" -o $landing_dir$today_product $amsr2_sic_url
    if [ $? -eq 0 ]; then
        # Download complete - have a product on the landing site
        echo "Download complete - gdalwarp to EPSG:3031..."
        $HOME/gdal/bin/gdalwarp -t_srs "EPSG:3031" $landing_dir$today_product $product_dir$today_product
        # Some sensible looking output
        echo "Some Java will execute here..."
        $HOME/java/current/bin/java -jar $HOME/bin/update_mosaic.jar amsr2_sic amsr2_sic "Bremen Uni Sea Ice Concentration chart" "Supplied by Bremen University, following Spreen, G., L. Kaleschke, and G.Heygster(2008), Sea ice remote sensing using AMSR-E 89 GHz channels J. Geophys. Res.,vol. 113, C02S03, doi:10.1029/2005JC003384. http://iup.physik.uni-bremen.de:8084/amsr2/"
        rm $landing_dir$today_product
    else
        # Failed
        echo "Failed to download product at "$amsr2_sic_url" to "$landing_dir$today_product", code was "$?
    fi
else
    # Nothing to do
    echo "Nothing to do"
fi
echo "Finished"
