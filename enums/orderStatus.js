export const enmOrderStatus = {
    Placed: 'placed',
    Brewing: 'brewing',
    Ready: 'ready',
    OutForDelivery: 'out_for_delivery',
    Delivered: 'delivered',
};

export const statusMessages = {
    [enmOrderStatus.Placed]: (id) => ({
        title: '☕ Your order is confirmed!',
        body: `Order #${id} has been received and will be prepared soon.`,
    }),
    [enmOrderStatus.Brewing]: (id) => ({
        title: 'Your order is brewing ☁️',
        body: `Order #${id} is being prepared.`,
    }),
    [enmOrderStatus.Ready]: (id) => ({
        title: 'Your order is ready at the counter.',
        body: `Order #${id} is ready for pickup.`,
    }),
    [enmOrderStatus.OutForDelivery]: (id) => ({
        title: 'Your coffee is on its way 🚚',
        body: `Order #${id} is out for delivery.`,
    }),
    [enmOrderStatus.Delivered]: (id) => ({
        title: 'Enjoy your coffee! ☕',
        body: `Order #${id} has been delivered.`,
    }),
};
