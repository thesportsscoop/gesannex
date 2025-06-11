module.exports = function(eleventyConfig) {
  // Directly copy the entire React build output to the root of the Eleventy output.
  // This means that the contents of your 'build' folder (including index.html, static assets)
  // will be placed directly into the '_site' directory.
  // This is crucial because Create React App automatically hashes asset filenames,
  // and its own index.html contains the correct references.
  eleventyConfig.addPassthroughCopy({ "build": "." });

  // Also copy the Netlify CMS admin folder
  eleventyConfig.addPassthroughCopy("admin");

  return {
    dir: {
      input: ".", // Eleventy will still look for content in the current directory if you have other Eleventy content
      output: "_site" // The default output directory for Eleventy
    },
    // Keep template formats for potential other Eleventy content if you add them later.
    // For the main app page, it's now directly copying React's HTML.
    templateFormats: ["html", "njk", "md"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk"
  };
};
