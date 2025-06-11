module.exports = function(eleventyConfig) {
  // Set your input and output directories
  return {
    dir: {
      input: ".",
      output: "_site" // The default output directory for Eleventy
    }
  };

  // Pass-through copy for React's build assets
  // This copies the entire 'build' folder from your React app
  // into a 'react-app' subfolder within Eleventy's output ('_site/react-app').
  // NOTE: React's default build creates a 'static' folder inside 'build'.
  // If you want to put 'static' directly under '_site', you might adjust this.
  // For simplicity, let's copy the entire build folder for now.
  eleventyConfig.addPassthroughCopy("build"); // This will copy 'build' to '_site/build'

  // More specifically, React's create-react-app builds into `build/static/css` and `build/static/js`.
  // Let's refine this to copy directly to `_site/static/css` and `_site/static/js`
  // by setting the correct passthrough copy for the static assets.
  eleventyConfig.addPassthroughCopy("build/static");

  // You might also need to copy favicon.ico, manifest.json, etc.
  eleventyConfig.addPassthroughCopy("build/favicon.ico");
  eleventyConfig.addPassthroughCopy("build/manifest.json");
  eleventyConfig.addPassthroughCopy("build/logo192.png");
  eleventyConfig.addPassthroughCopy("build/logo512.png");
  eleventyConfig.addPassthroughCopy("admin");

  // If you are using Netlify CMS, you'll need to copy the admin folder too:
  // eleventyConfig.addPassthroughCopy("admin"); // Assuming your Netlify CMS config is in an 'admin' folder

  return {
    dir: {
      input: ".",
      output: "_site"
    },
    templateFormats: ["njk", "md", "html"], // Add any formats you use
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk"
  };
};
