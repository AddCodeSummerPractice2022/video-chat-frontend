FROM nginx:stable-alpine

WORKDIR /app

COPY scripts /usr/share/nginx/html/scripts
COPY styles /usr/share/nginx/html/styles
COPY vendors /usr/share/nginx/html/vendors
COPY index.html /usr/share/nginx/html/index.html
COPY room.html /usr/share/nginx/html/room.html

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]
