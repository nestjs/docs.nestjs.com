git submodule update --init --recursive
for D in sources/*/; do sh -c "cd ${D} && npm i"; done