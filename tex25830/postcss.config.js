module.exports = {
  plugins: [
    require('postcss-advanced-variables')(),
    require('postcss-position-alt')(),
    require('postcss-calc')(),
    require('autoprefixer')({
      overrideBrowserslist: ['> 1%', 'last 3 versions', 'ie >= 9', 'ios >= 7', 'android >= 4.4']
    }),
    require('postcss-sorting')({
      'sort-order': 'zen'
    })
  ]
}
