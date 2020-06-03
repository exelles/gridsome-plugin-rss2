const RSS  = require('rss');
const fs   = require('fs');
const path = require('path');



module.exports = function( api, options ) {  
  if( ! options.output.subDir ) {
    options.output.subDir = "/";
  }
  
  if( ! options.output.name ) {
    options.output.name = "rss.xml";
  }
  
  api.loadSource(async store => {
    this.store = store;
  });
  
  api.afterBuild(async ({ queue, config }) => {    
    const outputPath = path.join( config.outputDir, options.output.subDir );
    const outputPathExists = fs.existsSync( outputPath );
    const fileName = options.output.name.endsWith('.xml') ? options.output.name : `${options.output.name}.xml`;

    console.log( `Generate RSS feed ${options.output.subDir}${fileName}` );
    
    const feed = new RSS( options.feedOptions );
    const {collection} = this.store.getCollection( options.contentTypeName );
    const dateField = options.dateField || 'date';
    
    let collectionData = [...collection.data];

    const collectionWithValidDates = collectionData.filter( node => !isNaN(new Date(node[dateField]).getTime()) );
    if( collectionWithValidDates.length === collectionData.length ) {
      collectionData.sort((nodeA, nodeB) => {
        if(options.latest) {
          return new Date(nodeB[dateField]).getTime() - new Date(nodeA[dateField]).getTime();
        }

        return new Date(nodeA[dateField]).getTime() - new Date(nodeB[dateField]).getTime();
      });
    }

    if( options.maxItems ) {
      collectionData = collectionData.filter( (item, index) => index < options.maxItems );
    }

    collectionData.forEach(item => {
      feed.item( options.feedItemOptions(item) );
    });

    if ( ! outputPathExists ) {
      fs.mkdirSync( outputPath );
    }
    
    fs.writeFileSync( path.resolve(outputPath, fileName), feed.xml() );
  });
}



module.exports.defaultOptions = () => ({
  contentTypeName: 'BlogPost',  // The typeName of the contentType you wish to generate your RSS file for.
  feedOptions: {
    title:     'Test',
    feed_url:  'http://localhost:8080/rss.xml',
    site_url:  'http://localhost:8080'
  },
  feedItemOptions: node => ({
    title: node.title,
    description: node.description,
    url: 'http://localhost:8080/post/' + node.slug,
    author: node.fields.author
  }),
  output: {
    subDir:  '/',
    name: 'rss.xml'
  }
})

