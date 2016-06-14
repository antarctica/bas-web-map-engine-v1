#!/bin/bash

# Download landing directory
landing_dir=/tmp

# Processed product directory
product_dir=$HOME"/geoserver_data/coverages/amsr2_sic/"

# This is unhelpfully in a Polar Stereographic projection whose latitude of true scale is -70 (not -71)
amsr2_sic_url=http://www.polarview.aq/27_AMSR2/antarctic_AMSR2.tif

# Start of today
start_today=$(date +'%Y-%m-%d 00:00:00')

# Filename for today's product
today_product="antarctic_amsr2_"$(date +'%Y%m%d')".tif"
echo "Starting - today's SIC product is "$today_product
if [ ! -s $product_dir$today_product ]; then
    # Product not found or is empty - see if it can be downloaded
    echo "Product not found or zero length - downloading from PVAN at "$amsr2_sic_url"..."
    curl -z $start_today -o $landing_dir$today_product $amsr2_sic_url
    if [ $? eq 0 ]; then
        # Download complete - have a product on the landing site
        echo "Download complete - gdalwarp to EPSG:3031..."
        $HOME/bin/gdal/gdalwarp -t_srs EPSG:3031 $landing_dir$today_product $product_dir$today_product
        if [ ! -s $product_dir$today_product ]; then
            # Some sensible looking output
            $HOME/java/current/bin/java -jar $HOME/bin/update_mosaic.jar amsr2_sic amsr2_sic "Bremen Uni Sea Ice Concentration chart" "Supplied by Bremen University, following Spreen, G., L. Kaleschke, and G.Heygster(2008), Sea ice remote sensing using AMSR-E 89 GHz channels J. Geophys. Res.,vol. 113, C02S03, doi:10.1029/2005JC003384. http://iup.physik.uni-bremen.de:8084/amsr2/"            
        else
            # Failed
            echo "Failed to reproject "$product_dir$today_product" to EPSG:3031"
        fi
    else
        # Failed
        echo "Failed to download product at "$amsr2_sic_url" to "$landing_dir$today_product", code was "$?
    fi
else 
    # Nothing to do
    echo "Nothing to do"
fi
echo "Finished"