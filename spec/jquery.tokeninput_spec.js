//     describe("", function() {});
//     it("", function() {});
//     before(function() {});

describe("jquery.tokeninput", function() {
  describe("test the environment", function() {
    it("shoud success", function() {
      expect(1+1).toEqual(2);
    });
  });
  describe("basic usage", function() {
    beforeEach(function() {
      setFixtures("<div id='test-token-input'><input id='target' type='text' /></div> ");
      $("#target").tokenInput("/tags");
    });
    
    it("should setup the token input list", function() {
      console.log($('#test-token-input').html());
      expect($('#test-token-input')).toContain("ul.token-input-list");
      expect($('#test-token-input')).toContain("ul.token-input-list li.token-input-input-token");
    });
    it("should setup a input", function() {
      expect($('#test-token-input')).toContain("ul.token-input-list li.token-input-input-token input");
    });
    it("should hide the original input", function() {
      expect($('#target')).toBeHidden();
    });
  });
});