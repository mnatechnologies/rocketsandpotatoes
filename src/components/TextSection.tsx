import React from 'react';

export default function TextSection() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Australia's Trusted Bullion Dealer
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam sodales hendrerit.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="p-6 rounded-lg bg-card border border-border shadow-sm">
              <h3 className="text-xl font-semibold mb-3 text-primary">Lorem</h3>
              <p className="text-muted-foreground">
               Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border shadow-sm">
              <h3 className="text-xl font-semibold mb-3 text-primary">Ipsum</h3>
              <p className="text-muted-foreground">
                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border shadow-sm">
              <h3 className="text-xl font-semibold mb-3 text-primary">Lorem Ipsum</h3>
              <p className="text-muted-foreground">
               Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
