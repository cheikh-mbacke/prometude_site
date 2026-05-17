FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY index.html sitemap.xml robots.txt /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/
COPY vendor/ /usr/share/nginx/html/vendor/

RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
