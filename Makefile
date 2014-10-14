BROWSERIFY=./node_modules/.bin/browserify
TESTLING=./node_modules/.bin/testling

all: example

test:
	npm test | faucet

example:
	$(BROWSERIFY) example/index.js > example/bundle.js

interactive_test:
	$(BROWSERIFY) test/index.js | $(TESTLING) -u

.PHONY: example test interactive_test
