# Use the Python3.8 image
FROM python:3.8-buster

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
ADD . /app

# Install cron
RUN apt-get -y update && apt-get install -y --no-install-recommends cron && rm -rf /var/lib/apt/lists/*

# Install the dependencies
RUN pip3.8 install -r requirements.txt

# Create & Configure Crontab
COPY cron /etc/cron.d/cron
RUN service cron start
RUN chmod +x /etc/cron.d/cron
RUN crontab /etc/cron.d/cron
RUN touch /var/log/cron.log

# Initial run
CMD ["/usr/sbin/cron","-f"]