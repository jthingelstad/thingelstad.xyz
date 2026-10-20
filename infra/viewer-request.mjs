// The viewer-request CloudFront Function for the site distribution (cloudfront-js-2.0), kept as source
// here so tests can run it. S3 behind Origin Access Control does not serve directory indexes, so
// "/things/elixir/" is rewritten to its index.html and "/things/elixir" is sent to the slash form. Paths
// with a dot are files and pass through. www.thingelstad.xyz answers with one redirect to the apex, already
// in slash form. Redirects keep the query string as the viewer sent it.
export const viewerRequestCode = `var apex = 'https://thingelstad.xyz';

function search(querystring) {
  var parts = [];
  for (var name in querystring) {
    var item = querystring[name];
    var values = item.multiValue ? item.multiValue : [item];
    for (var i = 0; i < values.length; i++) parts.push(values[i].value === '' ? name : name + '=' + values[i].value);
  }
  return parts.length ? '?' + parts.join('&') : '';
}

function moved(location) {
  return { statusCode: 301, statusDescription: 'Moved Permanently', headers: { location: { value: location } } };
}

function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var host = request.headers.host ? request.headers.host.value.toLowerCase() : '';
  var bare = !uri.endsWith('/') && !uri.split('/').pop().includes('.');
  var target = bare ? uri + '/' : uri;
  if (host === 'www.thingelstad.xyz') return moved(apex + target + search(request.querystring));
  if (bare) return moved(target + search(request.querystring));
  if (uri.endsWith('/')) request.uri = uri + 'index.html';
  return request;
}
`;
