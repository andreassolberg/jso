# Release management



```
npm run build

npm version prerelease ...  -m "Upgrade to %s for reasons"

npm version patch && git push --follow-tags && npm publish
npm version minor && git push --follow-tags && npm publish
npm version major && git push --follow-tags && npm publish
```



Reference for best practice library management with Webpack:

* <https://webpack.js.org/guides/author-libraries/>



# Branches


Currently `master` is the 2.x branch and `version3` is the 3.0 prerelease.
