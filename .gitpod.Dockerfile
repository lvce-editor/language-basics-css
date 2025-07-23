FROM gitpod/workspace-full:latest

RUN bash -c ". .nvm/nvm.sh \
    && nvm install 22.17.1 \
    && nvm use 22.17.1 \
    && nvm alias default 22.17.1"

RUN echo "nvm use default &>/dev/null" >> ~/.bashrc.d/51-nvm-fix
