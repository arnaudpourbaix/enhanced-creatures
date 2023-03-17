$(document).ready(function(){
  var monster = new Array();
	$(".name").each(function(index) {
    $(this).attr("name", $(this).html());
    $(this).after('<a class="back" href="#content">Back to top</a>');
    monster.push({anchor: $(this).html(), name: $(this).html()});
	});
  monster.sort(function(a, b) {
    if (a.name < b.name) {
      return -1;
    } else if (a.name > b.name) {
      return 1;
    } else {
      return 0;
    }
  });
  var nbLines = monster.length / 4;
  var line = 1;
  var col = 1;
  for(i = 0; i < monster.length; i++) {
    if (line > nbLines) {
      col++;
      line = 1;
    }
    $("#contentCol" + col).append('<li><a href="#' + monster[i].anchor + '">' + monster[i].name + '</a></li>');
    line++;
  }
});
