#!/bin/bash
# Weekly backup validation for RevivaTech
cd /opt/webapps/revivatech/scripts
./docker-database-backup.sh --validate
