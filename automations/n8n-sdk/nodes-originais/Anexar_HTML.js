const html = $json.html;
const buff = Buffer.from(html, 'utf8');
const now = new Date();
const p = (n) => String(n).padStart(2,'0');
const fileName = 'Analise_Base_Clientes_C6_Lojista_' + now.getFullYear() + '-' + p(now.getMonth()+1) + '-' + p(now.getDate()) + '.html';
return { json: {}, binary: { html: { data: buff.toString('base64'), mimeType: 'text/html', fileName: fileName, fileExtension: 'html' } } };