const ClickerUtils = {
    formatNumber(num) {
        if (num === null || num === undefined || isNaN(num)) return "0";
        if (num < 0) return "-" + this.formatNumber(Math.abs(num));
        if (num < 1000) {
            return Math.floor(num).toString();
        }
        
        const suffixes = ["", "K", "M", "B", "T", "Q"];
        const i = Math.floor(Math.log10(num) / 3);
        
        if (i >= suffixes.length) {
            return num.toExponential(2);
        }
        
        const value = num / Math.pow(10, i * 3);
        const formatted = value.toFixed(1);
        return formatted.replace(/\.0$/, "") + suffixes[i];
    }
};
