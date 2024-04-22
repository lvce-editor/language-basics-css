FROM gitpod/workspace-full:latest

RUN bash -c ". .nvm/nvm.sh \
    && nvm install 20.12.2 \
    && nvm use 20.12.2 \
    && nvm alias default 20.12.2"

RUN echo "nvm use default &>/dev/null" >> ~/.bashrc.d/51-nvm-fix
