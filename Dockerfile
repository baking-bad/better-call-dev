FROM node:latest AS base
RUN apt update && apt install -y libusb-1.0-0
RUN git clone https://github.com/baking-bad/better-call-dev.git
RUN cd better-call-dev && npm i
RUN cd better-call-dev && npm run build


FROM nginx:latest AS release
COPY --from=base /better-call-dev/dist /usr/share/nginx/html/
