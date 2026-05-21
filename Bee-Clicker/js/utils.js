const ClickerUtils = {
    formatNumber(num) {
        if (num === null || isNaN(num)) return "0";
        if (num < 1000) return num.toFixed(1).replace(".0", "");
        const suffixes = ["", "K", "M", "B", "T"];
        const i = Math.floor(Math.log10(num) / 3);
        if (i >= suffixes.length) return num.toExponential(2);
        const formatted = (num / Math.pow(10, i * 3)).toFixed(1);
        return formatted.replace(".0", "") + suffixes[i];
    }
};
