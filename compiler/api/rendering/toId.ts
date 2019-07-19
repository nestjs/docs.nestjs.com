module.exports = function toId() {
  return {
    name: 'toId',
    process: function(str: string) {
      return str.replace(/[^(a-z)(A-Z)(0-9)._-]/g, '-');
    }
  };
};
