FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY index.html styles.css /usr/share/nginx/html/
COPY src /usr/share/nginx/html/src
COPY portraits /usr/share/nginx/html/portraits
EXPOSE 80
