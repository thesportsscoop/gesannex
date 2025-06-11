module.exports = function(eleventyConfig) {
  // Directly copy the entire React build output to the root of the Eleventy output.
  // This means that the contents of your 'build' folder (including index.html, static assets)
  // will be placed directly into the '_site' directory.
  // This is crucial because Create React App automatically hashes asset filenames,
  // and its own index.html contains the correct references.
  eleventyConfig.addPassthroughCopy({ "build": "." });

  // Also copy the Netlify CMS admin folder
  eleventyConfig.addPassthroughCopy("admin");

  // IMPORTANT FIX: Copy the 'public' directory directly as static assets.
  // This prevents Eleventy from trying to process files inside 'public' as templates,
  // which was leading to the incorrect index.html being written to _site/public/.
  eleventyConfig.addPassthroughCopy("public");

  return {
    dir: {
      input: ".", // Eleventy will look for content in the current directory
      output: "_site" // The default output directory for Eleventy
    },
    // Keep template formats. The addPassthroughCopy for 'public' should handle preventing processing.
    templateFormats: ["html", "njk", "md"], // 'html' is kept for other potential Eleventy HTML templates
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk"
  };
};
